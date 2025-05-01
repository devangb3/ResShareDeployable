package com.resshare.ressharedeployable.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.util.UUID;

@Service
public class IPFSService {

    private final String protocol;
    private final String host;
    private final int clusterPort;
    private final int gatewayPort;

    public IPFSService() {
        try {
            ClassPathResource configResource = new ClassPathResource("config/ipfs.conf");
            try (InputStream is = configResource.getInputStream()) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode config = objectMapper.readTree(is);
                this.protocol = config.path("protocol").asText("http");
                this.host = config.path("host").asText("127.0.0.1");
                this.clusterPort = config.path("clusterPort").asInt(9094);
                this.gatewayPort = config.path("gatewayPort").asInt(8080);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read IPFS config file", e);
        }
    }

    public String uploadFile(File file) throws IOException, InterruptedException {
        String boundary = UUID.randomUUID().toString();
        String lineSeparator = "\r\n";

        var bodyBuilder = new StringBuilder();
        bodyBuilder.append("--").append(boundary).append(lineSeparator);
        bodyBuilder.append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                .append(file.getName()).append("\"").append(lineSeparator);
        bodyBuilder.append("Content-Type: application/octet-stream").append(lineSeparator).append(lineSeparator);

        byte[] fileBytes = Files.readAllBytes(file.toPath());
        byte[] headerBytes = bodyBuilder.toString().getBytes();
        byte[] footerBytes = (lineSeparator + "--" + boundary + "--" + lineSeparator).getBytes();

        byte[] requestBody = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, requestBody, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, requestBody, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, requestBody, headerBytes.length + fileBytes.length, footerBytes.length);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(protocol + "://" + host + ":" + clusterPort + "/add"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        String responseBody = response.body();
        System.out.println("Upload Response: " + responseBody);

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(responseBody);
        String cid = root.path("cid").path("/").asText();
        System.out.println("Uploaded CID = " + cid);
        return cid;
    }


    public InputStream downloadFile(String cid) throws IOException, InterruptedException {
        String url = protocol + "://" + host + ":" + gatewayPort + "/ipfs/" + cid;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

        return response.body(); // 可立即读，无需写盘
    }
}
