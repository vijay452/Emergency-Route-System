package com.ers.controller;

import com.ers.model.RouteCalculation;
import com.ers.repository.RouteCalculationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class RouteHistoryController {

    private final RouteCalculationRepository routeCalculationRepository;

    public RouteHistoryController(RouteCalculationRepository routeCalculationRepository) {
        this.routeCalculationRepository = routeCalculationRepository;
    }

    @GetMapping("/route-history")
    public ResponseEntity<List<RouteCalculation>> getRouteHistory() {
        return ResponseEntity.ok(routeCalculationRepository.findAll());
    }

    @PostMapping("/route-history")
    public ResponseEntity<?> saveRouteHistory(@RequestBody RouteHistoryRequest request) {
        if (isBlank(request.getStart()) || isBlank(request.getEnd())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Start and end are required"));
        }

        RouteCalculation route = new RouteCalculation();
        route.setStart(request.getStart());
        route.setEnd(request.getEnd());
        route.setEmergencyType(request.getEmergencyType());
        route.setDistanceKm(request.getDistanceKm());
        route.setEstimatedTimeMin(request.getEstimatedTimeMin());
        route.setRawTimeMin(request.getRawTimeMin());
        route.setStatus(request.getStatus());
        route.setRoads(request.getRoads());
        route.setStartPoint(toPoint(request.getStartPoint()));
        route.setEndPoint(toPoint(request.getEndPoint()));
        route.setCreatedAt(Instant.now());

        RouteCalculation saved = routeCalculationRepository.save(route);
        return ResponseEntity.ok(Map.of(
                "message", "Route calculation stored successfully",
                "id", saved.getId()
        ));
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static RouteCalculation.RoutePoint toPoint(RoutePointRequest request) {
        if (request == null) {
            return null;
        }

        RouteCalculation.RoutePoint point = new RouteCalculation.RoutePoint();
        point.setLabel(request.getLabel());
        point.setLat(request.getLat());
        point.setLng(request.getLng());
        return point;
    }

    public static class RouteHistoryRequest {
        private String start;
        private String end;
        private String emergencyType;
        private Double distanceKm;
        private Double estimatedTimeMin;
        private Double rawTimeMin;
        private String status;
        private List<String> roads;
        private RoutePointRequest startPoint;
        private RoutePointRequest endPoint;

        public String getStart() { return start; }
        public void setStart(String start) { this.start = start; }
        public String getEnd() { return end; }
        public void setEnd(String end) { this.end = end; }
        public String getEmergencyType() { return emergencyType; }
        public void setEmergencyType(String emergencyType) { this.emergencyType = emergencyType; }
        public Double getDistanceKm() { return distanceKm; }
        public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
        public Double getEstimatedTimeMin() { return estimatedTimeMin; }
        public void setEstimatedTimeMin(Double estimatedTimeMin) { this.estimatedTimeMin = estimatedTimeMin; }
        public Double getRawTimeMin() { return rawTimeMin; }
        public void setRawTimeMin(Double rawTimeMin) { this.rawTimeMin = rawTimeMin; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public List<String> getRoads() { return roads; }
        public void setRoads(List<String> roads) { this.roads = roads; }
        public RoutePointRequest getStartPoint() { return startPoint; }
        public void setStartPoint(RoutePointRequest startPoint) { this.startPoint = startPoint; }
        public RoutePointRequest getEndPoint() { return endPoint; }
        public void setEndPoint(RoutePointRequest endPoint) { this.endPoint = endPoint; }
    }

    public static class RoutePointRequest {
        private String label;
        private Double lat;
        private Double lng;

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
    }
}
