package com.resshare.ressharedeployable;
import org.springframework.core.io.ClassPathResource;
import com.resshare.ressharedeployable.service.IPFSService;
import com.resshare.ressharedeployable.service.RSDBKvService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ResShareDeployableApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResShareDeployableApplication.class, args);
    }

}
