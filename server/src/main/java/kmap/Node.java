package kmap;

import com.google.gson.JsonArray;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by holger on 30.03.17.
 */
public class Node {
    String module;
    String topic;
    Long created;
    Long modified;
    String author;
    Integer row;
    Integer column;
    private List<String> depends = new ArrayList<>();
    Integer priority;
    private String links;
    private String keywords;
    private String sgs;
    private String description;
    private String summary;
    private String thumb;
    private JsonArray attachments;
    private List<String> annotations = new ArrayList<>();

    public Node(String topic) {
        this.topic = topic;
    }

    public String getTopic() {
        return topic;
    }

    public Integer getRow() {
        return row;
    }

    public void setRow(Integer row) {
        this.row = row;
    }

    public Integer getColumn() {
        return column;
    }

    public void setColumn(Integer column) {
        this.column = column;
    }

    @Override
    public String toString() {
        return topic;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Node)) return false;

        Node node = (Node) o;

        return topic.equals(node.topic);
    }

    @Override
    public int hashCode() {
        return topic.hashCode();
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public Long getCreated() {
        return created;
    }

    public void setCreated(Long created) {
        this.created = created;
    }

    public Long getModified() {
        return modified;
    }

    public void setModified(Long modified) {
        this.modified = modified;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public List<String> getDepends() {
        return depends;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getLinks() {
        return links;
    }

    public void setLinks(String links) {
        this.links = links;
    }

    public String getKeywords() { return keywords; }

    public void setKeywords(String keywords) { this.keywords = keywords; }

    public String getSGS() { return sgs; }

    public void setSGS(String sgs) { this.sgs = sgs; }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getThumb() {
        return thumb;
    }

    public void setThumb(String thumb) {
        this.thumb = thumb;
    }

    public JsonArray getAttachments() {
        return attachments;
    }

    public void setAttachments(JsonArray attachments) {
        this.attachments = attachments;
    }

    public List<String> getAnnotations() {
        return annotations;
    }
}
