package com.resshare.ressharedeployable.service;

import com.sun.jna.Library;
import com.sun.jna.Native;
import org.springframework.core.io.ClassPathResource;

import java.io.*;

public class RSDBKvService {

    public interface KVLib extends Library {
        String kv_get(String key, String configPath);
        int kv_set(String key, String value, String configPath);
    }

    public static final KVLib INSTANCE;

    static {
        try {
            ClassPathResource soResource = new ClassPathResource("native/libkv.so");
            File tempLib = File.createTempFile("libkv", ".so");
            try (InputStream is = soResource.getInputStream(); OutputStream os = new FileOutputStream(tempLib)) {
                is.transferTo(os);
            }
            tempLib.deleteOnExit();
            INSTANCE = Native.load(tempLib.getAbsolutePath(), KVLib.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load libkv.so from resources", e);
        }
    }

    private final String configPath;

    public RSDBKvService() {
        this.configPath = resolveConfigPath();
    }

    private String resolveConfigPath() {
        try {
            ClassPathResource configResource = new ClassPathResource("config/resdb_config.conf");
            File tempConfig = File.createTempFile("resdb_config", ".conf");
            try (InputStream is = configResource.getInputStream(); OutputStream os = new FileOutputStream(tempConfig)) {
                is.transferTo(os);
            }
            tempConfig.deleteOnExit();
            return tempConfig.getAbsolutePath();
        } catch (Exception e) {
            throw new RuntimeException("Failed to load resdb_config.conf from resources", e);
        }
    }

    public String get(String key) {
        return INSTANCE.kv_get(key, configPath);
    }

    public boolean set(String key, String value) {
        return INSTANCE.kv_set(key, value, configPath) == 0;
    }
}
