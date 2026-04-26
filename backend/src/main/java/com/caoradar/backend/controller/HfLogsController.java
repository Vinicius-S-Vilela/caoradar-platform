package com.caoradar.backend.controller;

import com.caoradar.backend.service.HfLogsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class HfLogsController {

    @Autowired
    private HfLogsService hfLogsService;

    /** Polling tradicional — mantido para compatibilidade. */
    @GetMapping("/ia-logs")
    public Map<String, Object> getIaLogs(
            @RequestParam(defaultValue = "0")     long    since,
            @RequestParam(defaultValue = "500")   int     limit,
            @RequestParam(defaultValue = "run")   String  source,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        return hfLogsService.getLogs(source, since, limit, force);
    }

    /** SSE stream — re-encaminha em tempo real o /logs/{source} do HF. */
    @GetMapping(value = "/ia-logs/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamIaLogs(@RequestParam(defaultValue = "run") String source) {
        return hfLogsService.openStream(source);
    }
}
