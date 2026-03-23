package com.ers.repository;

import com.ers.model.TrafficData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrafficDataRepository extends MongoRepository<TrafficData, String> {
    Optional<TrafficData> findByFromNodeAndToNode(Integer fromNode, Integer toNode);
}
