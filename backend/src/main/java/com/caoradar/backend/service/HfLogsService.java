package com.caoradar.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Proxy para a API de logs do Hugging Face Spaces.
 *
 * O frontend (painel admin) faz polling neste serviço a cada poucos segundos.
 * Para não martelar o HF — e não sobrecarregar o IA service — mantemos um
 * buffer dedupado em memória e só batemos no HF quando o cache TTL expira.
 */
@Service
public class HfLogsService {

    @Value("${HF_TOKEN:}")
    private String hfToken;

    @Value("${HF_SPACE_ID:PalmaPedroA/caoradar-iaservice}")
    private String hfSpaceId;

    private static final long CACHE_TTL_MS    = 10_000;
    private static final int  MAX_BUFFER      = 500;
    private static final long HARD_DEADLINE_MS = 4_000;

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, SourceState> states = new ConcurrentHashMap<>();
    private HttpClient http;

    @PostConstruct
    void init() {
        http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        states.put("run",   new SourceState());
        states.put("build", new SourceState());
    }

    public static class LogEntry {
        public long   id;
        public String timestamp;
        public String message;

        public LogEntry(long id, String ts, String msg) {
            this.id        = id;
            this.timestamp = ts;
            this.message   = msg;
        }
    }

    private static class SourceState {
        final Deque<LogEntry>   buffer  = new ArrayDeque<>();
        final LinkedHashSet<String> seen = new LinkedHashSet<>();
        final AtomicLong counter        = new AtomicLong();
        final Object lock               = new Object();
        long lastFetchMs                = 0;
    }

    public Map<String, Object> getLogs(String source, long sinceId, int limit) {
        return getLogs(source, sinceId, limit, false);
    }

    public Map<String, Object> getLogs(String source, long sinceId, int limit, boolean force) {
        String src    = "build".equals(source) ? "build" : "run";
        SourceState st = states.get(src);

        synchronized (st.lock) {
            long now = System.currentTimeMillis();
            boolean stale = now - st.lastFetchMs > CACHE_TTL_MS;
            if (!hfToken.isEmpty() && (force || stale)) {
                st.lastFetchMs = now;
                try {
                    fetchAndStore(src, st);
                } catch (Exception e) {
                    addEntry(st, null, "[hf_logs] erro ao consultar HF: " + e.getMessage());
                }
            }
        }

        List<LogEntry> snapshot;
        synchronized (st.lock) {
            snapshot = new ArrayList<>(st.buffer);
        }

        List<LogEntry> filtered = new ArrayList<>();
        for (LogEntry e : snapshot) {
            if (e.id > sinceId) filtered.add(e);
        }
        if (filtered.size() > limit) {
            filtered = filtered.subList(filtered.size() - limit, filtered.size());
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("logs",   filtered);
        resp.put("stats",  computeStats(snapshot));
        resp.put("source", hfToken.isEmpty() ? "disabled" : src);
        return resp;
    }

    private Map<String, Object> computeStats(List<LogEntry> items) {
        int errors = 0, videos = 0, matches = 0;
        for (LogEntry e : items) {
            String low = e.message.toLowerCase(Locale.ROOT);
            if (e.message.contains("❌") || low.contains("erro")) errors++;
            if (e.message.contains("/api/video/process"))         videos++;
            if (e.message.contains("/api/match/relato"))          matches++;
        }
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("total",              items.size());
        s.put("errors",             errors);
        s.put("videos_processados", videos);
        s.put("matches_iniciados",  matches);
        s.put("last_id",            items.isEmpty() ? 0 : items.get(items.size() - 1).id);
        return s;
    }

    private void fetchAndStore(String source, SourceState st) throws Exception {
        String url = "https://huggingface.co/api/spaces/" + hfSpaceId + "/logs/" + source;
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .header("Authorization", "Bearer " + hfToken)
                .header("Accept",        "text/event-stream")
                .GET()
                .build();

        HttpResponse<java.io.InputStream> resp =
                http.send(req, HttpResponse.BodyHandlers.ofInputStream());

        if (resp.statusCode() / 100 != 2) {
            addEntry(st, null,
                "[hf_logs] HF API HTTP " + resp.statusCode() + " em /" + source
                + " — verifique HF_TOKEN/HF_SPACE_ID");
            return;
        }

        long deadline = System.currentTimeMillis() + HARD_DEADLINE_MS;
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(resp.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (System.currentTimeMillis() > deadline) break;

                String parsed = line.trim();
                if (parsed.isEmpty() || parsed.startsWith(":")) continue;
                if (parsed.startsWith("data:")) parsed = parsed.substring(5).trim();
                if (parsed.isEmpty()) continue;

                String ts  = null;
                String msg = parsed;
                try {
                    JsonNode node = mapper.readTree(parsed);
                    if (node.isObject()) {
                        JsonNode tsn = firstNonNull(node, "timestamp", "time", "ts");
                        if (tsn != null) ts = tsn.asText();
                        JsonNode mn  = firstNonNull(node, "data", "message", "line", "log");
                        if (mn != null) msg = mn.isTextual() ? mn.asText() : mn.toString();
                    }
                } catch (Exception ignored) { /* fica o texto cru */ }

                addEntry(st, ts, msg);
            }
        }
    }

    private static JsonNode firstNonNull(JsonNode node, String... keys) {
        for (String k : keys) {
            JsonNode v = node.get(k);
            if (v != null && !v.isNull()) return v;
        }
        return null;
    }

    private void addEntry(SourceState st, String ts, String msg) {
        if (msg == null) return;
        msg = msg.replaceAll("\\s+$", "");
        if (msg.isEmpty()) return;

        String key = sha1(msg);
        if (st.seen.contains(key)) return;

        long id = st.counter.incrementAndGet();
        LogEntry entry = new LogEntry(id, ts != null ? ts : Instant.now().toString(), msg);
        st.buffer.add(entry);
        if (st.buffer.size() > MAX_BUFFER) st.buffer.pollFirst();

        st.seen.add(key);
        if (st.seen.size() > MAX_BUFFER * 4) {
            Iterator<String> it = st.seen.iterator();
            for (int i = 0; i < MAX_BUFFER && it.hasNext(); i++) {
                it.next();
                it.remove();
            }
        }
    }

    private static String sha1(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] b = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(b.length * 2);
            for (byte x : b) sb.append(String.format("%02x", x));
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(s.hashCode());
        }
    }
}
