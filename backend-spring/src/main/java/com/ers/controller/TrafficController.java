package com.ers.controller;

import com.ers.model.TrafficData;
import com.ers.repository.TrafficDataRepository;
import com.ers.service.DataSyncService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class TrafficController {

    private final TrafficDataRepository trafficDataRepository;
    private final DataSyncService syncService;

    public TrafficController(TrafficDataRepository trafficDataRepository, DataSyncService syncService) {
        this.trafficDataRepository = trafficDataRepository;
        this.syncService = syncService;
    }

    @GetMapping("/traffic")
    public ResponseEntity<List<TrafficData>> getTraffic() {
        return ResponseEntity.ok(trafficDataRepository.findAll());
    }

    @PostMapping("/traffic/alert")
    public ResponseEntity<?> addAlert(@RequestBody TrafficAlertRequest alert) {
        Optional<TrafficData> existing = trafficDataRepository.findByFromNodeAndToNode(alert.getFromNode(),
                alert.getToNode());

        TrafficData data = existing.orElse(new TrafficData());
        data.setFromNode(alert.getFromNode());
        data.setToNode(alert.getToNode());
        data.setCongestionLevel(alert.getCongestionLevel());
        data.setSpeedMultiplier(alert.getSpeedMultiplier());
        data.setStatus(alert.getStatus());

        trafficDataRepository.save(data);
        syncService.syncToLocalFiles();

        return ResponseEntity.ok(Map.of("message", "Traffic alert processed successfully"));
    }

    public static class TrafficAlertRequest {
        private Integer fromNode;
        private Integer toNode;
        private Double congestionLevel;
        private Double speedMultiplier;
        private String status;
        
        public Integer getFromNode() { return fromNode; }
        public void setFromNode(Integer fromNode) { this.fromNode = fromNode; }
        public Integer getToNode() { return toNode; }
        public void setToNode(Integer toNode) { this.toNode = toNode; }
        public Double getCongestionLevel() { return congestionLevel; }
        public void setCongestionLevel(Double congestionLevel) { this.congestionLevel = congestionLevel; }
        public Double getSpeedMultiplier() { return speedMultiplier; }
        public void setSpeedMultiplier(Double speedMultiplier) { this.speedMultiplier = speedMultiplier; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
