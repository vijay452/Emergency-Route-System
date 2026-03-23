package com.ers.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "traffic_data")
public class TrafficData {
    @Id
    private String id;
    
    private Integer fromNode;
    private Integer toNode;
    private Double congestionLevel;
    private Double speedMultiplier;
    private String status;

    public TrafficData() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
