package com.resshare.ressharedeployable.repository;

import com.resshare.ressharedeployable.entity.UserEntity;
import org.springframework.data.repository.ListCrudRepository;

public interface UserRepository extends ListCrudRepository<UserEntity, String> {
}
