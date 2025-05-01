package com.resshare.ressharedeployable;

import com.resshare.ressharedeployable.service.IPFSService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.*;

import static org.junit.jupiter.api.Assertions.*;

public class IPFSServiceTest {

    private IPFSService ipfsService;

    @BeforeEach
    public void setUp() {
        ipfsService = new IPFSService(); // 自动加载 ipfs.conf
    }

    @Test
    public void testUploadAndDownloadInMemory() throws Exception {
        // 加载测试文件为 File
        File inputFile = new ClassPathResource("test_image.jpg").getFile();
        byte[] originalBytes = readAllBytes(inputFile);

        // 上传到 IPFS
        String cid = ipfsService.uploadFile(inputFile);
        assertNotNull(cid);
        assertFalse(cid.isEmpty());

        // 下载为 InputStream
        try (InputStream downloadedStream = ipfsService.downloadFile(cid)) {
            byte[] downloadedBytes = downloadedStream.readAllBytes();

            // 内容一致性校验
            assertArrayEquals(originalBytes, downloadedBytes, "Downloaded file content should match uploaded file");
        }
    }

    // 工具方法：读取文件所有字节
    private byte[] readAllBytes(File file) throws IOException {
        try (InputStream is = new FileInputStream(file)) {
            return is.readAllBytes();
        }
    }
}
