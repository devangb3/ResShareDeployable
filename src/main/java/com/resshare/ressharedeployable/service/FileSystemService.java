package com.resshare.ressharedeployable.service;

import com.resshare.ressharedeployable.model.FileNode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


public class FileSystemService {
    private final Map<String, FileNode> userFileTree = new ConcurrentHashMap<>();


    private String fileTreeToString() {
        ObjectMapper mapper = new ObjectMapper();
        try {
            return mapper.writeValueAsString(userFileTree);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    public void initializeUserFileTree(String userId) {

    }


}
