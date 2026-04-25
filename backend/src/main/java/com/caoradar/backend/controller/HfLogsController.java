package com.caoradar.backend.controller;

import com.caoradar.backend.service.HfLogsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class HfLogsController {

    @Autowired
    private HfLogsService hfLogsService;

    @GetMapping("/ia-logs")
    public Map<String, Object> getIaLogs(
            @RequestParam(defaultValue = "0")   long   since,
            @RequestParam(defaultValue = "500") int    limit,
            @RequestParam(defaultValue = "run") String source
    ) {
        return hfLogsService.getLogs(source, since, limit);
    }
}
