package com.caoradar.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/teste")
    public String teste() {
        return "Backend CAORADAR está online!";
    }
}