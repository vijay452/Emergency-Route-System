package com.ers.controller;

import com.ers.model.CityNode;
import com.ers.repository.CityNodeRepository;
import com.ers.service.DataSyncService;
import com.ers.service.RouteEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RouteController {

    private static final Logger log = LoggerFactory.getLogger(RouteController.class);

    private final CityNodeRepository nodeRepository;
    private final RouteEngineService routeEngineService;
    private final DataSyncService syncService;

    public RouteController(CityNodeRepository nodeRepository, RouteEngineService routeEngineService, DataSyncService syncService) {
        this.nodeRepository = nodeRepository;
        this.routeEngineService = routeEngineService;
        this.syncService = syncService;
    }

    @GetMapping("/routes")
    public ResponseEntity<List<CityNode>> getAvailableRoutes() {
        return ResponseEntity.ok(nodeRepository.findAll());
    }

    @PostMapping("/route")
    public ResponseEntity<?> findRoute(@RequestBody RouteRequest request) {
        try {
            // Re-sync before calculating route to ensure C++ engine has the latest MongoDB state
            syncService.syncToLocalFiles();
            
            // Look up nodes
            CityNode startNode = nodeRepository.findByName(request.getStart())
                    .orElseThrow(() -> new IllegalArgumentException("Start node not found"));
            CityNode endNode = nodeRepository.findByName(request.getEnd())
                    .orElseThrow(() -> new IllegalArgumentException("End node not found"));

            String routeResult = routeEngineService.calculateRoute(startNode.getNodeId(), endNode.getNodeId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", routeResult, // Assuming frontend expects string or parsed JSON we might need to parse it
                    "start", startNode,
                    "end", endNode
            ));
        } catch (Exception e) {
            log.error("Failed to find route", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class RouteRequest {
        private String start;
        private String end;
        
        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }
        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
    }
}
