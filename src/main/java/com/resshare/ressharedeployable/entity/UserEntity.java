package com.resshare.ressharedeployable.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("users")
public record UserEntity(
        @Id String username,
        String password
) {
}
