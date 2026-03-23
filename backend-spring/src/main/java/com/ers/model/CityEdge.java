package com.ers.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "city_edges")
public class CityEdge {
    @Id
    private String id;
    
    private Integer fromNode;
    private Integer toNode;
    private Double distance;

    public CityEdge() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getFromNode() { return fromNode; }
    public void setFromNode(Integer fromNode) { this.fromNode = fromNode; }
    public Integer getToNode() { return toNode; }
    public void setToNode(Integer toNode) { this.toNode = toNode; }
    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }
}
