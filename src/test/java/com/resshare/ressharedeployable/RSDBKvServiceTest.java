package com.resshare.ressharedeployable;

import com.resshare.ressharedeployable.service.RSDBKvService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class RSDBKvServiceTest {

    private RSDBKvService service;

    @BeforeEach
    public void setUp() {
        service = new RSDBKvService();
    }

    @Test
    public void testSetAndGet() {
        String key = "test-key";
        String value = "test-value";

        boolean success = service.set(key, value);
        assertTrue(success, "KV set should succeed");

        String result = service.get(key);
        assertEquals(value, result, "KV get should return the same value that was set");
    }

    @Test
    public void testGetNonExistentKey() {
        String result = service.get("non-existent-key-" + System.currentTimeMillis());
        assertTrue(result == null || result.isEmpty(), "Non-existent key should return null or empty string");
    }
}
