package kmap;

/**
 * Created by holger on 30.03.17.
 */
public class Connection {
    Node source;
    Node target;

    public Connection(Node source, Node target) {
        assert source != null;
        assert target != null;
        this.source = source;
        this.target = target;
    }

    public Node getSource() {
        return source;
    }

    public Node getTarget() {
        return target;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Connection)) return false;

        Connection that = (Connection)o;

        if (!source.equals(that.source)) return false;
        return target.equals(that.target);
    }

    @Override
    public int hashCode() {
        int result = source.hashCode();
        result = 31 * result + target.hashCode();
        return result;
    }
}
