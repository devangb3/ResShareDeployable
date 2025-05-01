package com.resshare.ressharedeployable.model;

import java.util.List;
import java.util.ArrayList;

public class FileNode {
    private String name;
    private boolean isDirectory;
    private List<FileNode> children;

    public FileNode(String name, boolean isDirectory) {
        this.name = name;
        this.isDirectory = isDirectory;
        if (isDirectory) {
            this.children = new ArrayList<>();
        }
    }

    public String getName() {
        return this.name;
    }

    public boolean isDirectory() {
        return isDirectory;
    }

    public List<FileNode> getChildren() {
        return children;
    }

    public void addChild(FileNode child) {
        if (isDirectory && children != null) {
            children.add(child);
        }
    }
}
