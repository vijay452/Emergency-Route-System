package com.ers.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "route_history")
public class RouteCalculation {
    @Id
    private String id;

    private String start;
    private String end;
    private String emergencyType;
    private Double distanceKm;
    private Double estimatedTimeMin;
    private Double rawTimeMin;
    private String status;
    private List<String> roads;
    private RoutePoint startPoint;
    private RoutePoint endPoint;
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public RoutePoint getStartPoint() { return startPoint; }
    public void setStartPoint(RoutePoint startPoint) { this.startPoint = startPoint; }
    public RoutePoint getEndPoint() { return endPoint; }
    public void setEndPoint(RoutePoint endPoint) { this.endPoint = endPoint; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static class RoutePoint {
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
