package com.ers.repository;

import com.ers.model.RouteCalculation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RouteCalculationRepository extends MongoRepository<RouteCalculation, String> {
}
