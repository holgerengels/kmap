package kmap;

import com.google.gson.*;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.*;

/**
 * Created by holger on 30.03.17.
 */
public class Test {
    public static void main(String[] args) throws FileNotFoundException {
        new Test(args[0]);
    }

    public Test(String fileName) throws FileNotFoundException {
        JsonArray chapters = (JsonArray)new JsonParser().parse(new FileReader(fileName));
        for (JsonElement chapterElement : chapters) {
            JsonObject chapter = (JsonObject)chapterElement;
            JsonArray topics = chapter.getAsJsonArray("topics");

            Map<String, Node> nodes = new HashMap<>();
            Map<String, Connection> connections = new HashMap<>();

            for (JsonElement topicElement : topics) {
                JsonObject topic = (JsonObject)topicElement;
                String topicName = topic.getAsJsonPrimitive("topic").getAsString();
                Node node = nodes.computeIfAbsent(topicName, s3 -> new Node(topicName));
                //System.out.println(node);
                JsonArray depends = topic.getAsJsonArray("depends");
                for (JsonElement depend : depends) {
                    String dependsOn = depend.getAsString();
                    //System.out.println("--> " + dependsOn);
                    connections.computeIfAbsent(dependsOn + ":" + topicName, s -> new Connection(nodes.get(dependsOn), nodes.get(topicName)));
                }
            }

            //System.out.println("nodes = " + nodes.size());
            List<Node> list = layout(nodes, connections);
            print(chapter.getAsJsonPrimitive("chapter").getAsString(), list);
        }
    }

    private List<Node> layout(Map<String, Node> nodes, Map<String, Connection> connections) {
        Set<Node> nodeSet = new HashSet<>(nodes.values());
        Set<Connection> connectionSet = new HashSet<>(connections.values());
        NodeLayouter.layout(nodeSet, connectionSet);
        List<Node> list = new ArrayList<>(nodeSet);
        list.sort((o1, o2) -> {
            if (o1.row != o2.row)
                return o1.row - o2.row;
            else
                return o1.column - o2.column;
        });
        return list;
    }

    private void print(String chapter, List<Node> list) {
        System.out.println("*** " + chapter + " ***");
        int row = 0;
        for (Node node : list) {
            if (node.row != row) {
                System.out.println();
                row++;
            }
            else if (!new Integer(0).equals(node.column)) {
                System.out.print(", ");
            }
            System.out.print(node.topic);
        }
        System.out.println();

        System.out.println();
    }

}
