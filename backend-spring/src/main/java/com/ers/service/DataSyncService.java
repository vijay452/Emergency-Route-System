package com.ers.service;

import com.ers.model.CityEdge;
import com.ers.model.CityNode;
import com.ers.model.TrafficData;
import com.ers.repository.CityEdgeRepository;
import com.ers.repository.CityNodeRepository;
import com.ers.repository.TrafficDataRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@Service
public class DataSyncService {

    private static final Logger log = LoggerFactory.getLogger(DataSyncService.class);

    private final CityNodeRepository cityNodeRepository;
    private final CityEdgeRepository cityEdgeRepository;
    private final TrafficDataRepository trafficDataRepository;

    public DataSyncService(CityNodeRepository cityNodeRepository, CityEdgeRepository cityEdgeRepository, TrafficDataRepository trafficDataRepository) {
        this.cityNodeRepository = cityNodeRepository;
        this.cityEdgeRepository = cityEdgeRepository;
        this.trafficDataRepository = trafficDataRepository;
    }

    @Value("${ers.data.graph-path}")
    private String graphPath;

    @Value("${ers.data.traffic-path}")
    private String trafficPath;

    @PostConstruct
    public void init() {
        // Here we ensure that MongoDB has data. 
        // If empty, we could parse the local files and push them to MongoDB.
        // For now, let's just reverse sync: dump current MongoDB data to the local files 
        // so the C++ engine has the latest data.
        syncToLocalFiles();
    }

    public synchronized void syncToLocalFiles() {
        try {
            writeGraphFile();
            writeTrafficFile();
            log.info("Successfully synced MongoDB data to local files for C++ Engine.");
        } catch (Exception e) {
            log.error("Failed to sync data to local files", e);
        }
    }

    private void writeGraphFile() throws IOException {
        File file = new File(graphPath);
        file.getParentFile().mkdirs();
        try (FileWriter writer = new FileWriter(file)) {
            List<CityNode> nodes = cityNodeRepository.findAll();
            for (CityNode node : nodes) {
                writer.write(String.format("NODE %d %s %f %f %s\n", 
                    node.getNodeId(), node.getName(), node.getLat(), node.getLon(), node.getType()));
            }
            
            List<CityEdge> edges = cityEdgeRepository.findAll();
            for (CityEdge edge : edges) {
                writer.write(String.format("EDGE %d %d %f\n", 
                    edge.getFromNode(), edge.getToNode(), edge.getDistance()));
            }
        }
    }

    private void writeTrafficFile() throws IOException {
        File file = new File(trafficPath);
        file.getParentFile().mkdirs();
        try (FileWriter writer = new FileWriter(file)) {
            List<TrafficData> trafficList = trafficDataRepository.findAll();
            for (TrafficData data : trafficList) {
                writer.write(String.format("%d %d %f %f %s\n",
                    data.getFromNode(), data.getToNode(), data.getCongestionLevel(), 
                    data.getSpeedMultiplier(), data.getStatus()));
            }
        }
    }
}
