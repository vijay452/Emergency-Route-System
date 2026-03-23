package com.ers.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "city_nodes")
public class CityNode {
    @Id
    private String id;
    
    private Integer nodeId;
    private String name;
    private Double lat;
    private Double lon;
    private String type;

    public CityNode() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getNodeId() { return nodeId; }
    public void setNodeId(Integer nodeId) { this.nodeId = nodeId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
