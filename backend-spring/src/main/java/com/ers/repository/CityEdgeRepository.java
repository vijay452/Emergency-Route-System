package com.ers.repository;

import com.ers.model.CityEdge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityEdgeRepository extends MongoRepository<CityEdge, String> {
    List<CityEdge> findByFromNode(Integer fromNode);
}
