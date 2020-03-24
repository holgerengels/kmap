package kmap;

import java.util.Objects;

class Attachment {
    String id;
    String name;
    String tag = null;
    String type;
    Integer size;

    public Attachment(String fileId, String fileName, String fileType, Integer fileSize) {
        id = fileId;
        name = fileName;
        type = fileType;
        size = fileSize;
    }

    @Override
    public String toString() {
        return "{" +
            "id='" + id + '\'' +
            ", name='" + name + '\'' +
            ", tag='" + tag + '\'' +
            ", type='" + type + '\'' +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Attachment that = (Attachment) o;
        return name.equals(that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
