package com.ers.repository;

import com.ers.model.CityNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CityNodeRepository extends MongoRepository<CityNode, String> {
    Optional<CityNode> findByNodeId(Integer nodeId);
    Optional<CityNode> findByName(String name);
}
