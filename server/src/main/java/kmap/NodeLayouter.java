package kmap;/*
 * $Id: NodeLayouter.java 472 2005-07-04 17:18:14Z hengels $
 * (c) Copyright 2004 con:cern development team.
 *
 * This file is part of con:cern (http://concern.org).
 *
 * con:cern is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License
 * as published by the Free Software Foundation; either version 2.1
 * of the License, or (at your option) any later version.
 *
 * Please see COPYING for the complete licence.
 */

import java.util.*;

/**
 * @author hengels
 * @version $Revision: 472 $
 */
public class NodeLayouter
{
    private static final boolean DOWN = true;
    private static final boolean UP = false;

    public static void layout(Set<Node> nodes, Set<Connection> connections) {
        for (Node node : nodes) {
            node.setRow(null);
            node.setColumn(null);
        }

        List<Node> tails = new ArrayList<>(nodes);
        for (Connection connection : connections)
            tails.remove(connection.getSource());

        for (Node node : tails)
            level(node, connections);

        SortedMap<Integer,List<Node>> map = new TreeMap<>();
        for (Node cell : nodes) {
            Integer layer = cell.getRow();
            List<Node> list = map.computeIfAbsent(layer, k -> new ArrayList<>());
            list.add(cell);
        }

        unknot(connections, map, map.size()-1, UP);
        unknot(connections, map, 0, DOWN);
    }

    public static int level(Node node, Collection<Connection> connections) {
        if (node == null)
            return 0;
        if (node.getRow() != null)
            return node.getRow();

        int level = 0;
        for (Connection connection : connections) {
            if (connection.getTarget() == node) {
                level = Math.max(level, level(connection.getSource(), connections));
            }
        }
        node.setRow(level + 1);
        return level + 1;
    }


    private static void unknot(final Set<Connection> connections, final SortedMap<Integer,List<Node>> map, Integer firstLayer, final boolean direction) {
        Iterator<Map.Entry<Integer,List<Node>>> iterator = direction ? map.tailMap(firstLayer).entrySet().iterator() : map.headMap(firstLayer).entrySet().iterator();
        //iterator.next();
        while (iterator.hasNext()) {
            Map.Entry<Integer,List<Node>> entry = iterator.next();
            final Integer layer = entry.getKey();
            final List<Node> members = entry.getValue();
            final SortedMap<Integer,List<Node>> head = map.headMap(layer);

            Collections.sort(members, (o1, o2) -> {
                int p1 = o1.priority != null ? o1.priority : 0;
                int p2 = o2.priority != null ? o2.priority : 0;
                int diff = p2 - p1;
                if (diff != 0)
                    return diff;
                return (int)((relativePosition(connections, o1, direction, map) - relativePosition(connections, o2, direction, map)) * 100);
            });

            int i = 1;
            for (Node node : members) {
                node.setColumn(i++);
                //System.out.print(" " + node);
            }
            //System.out.println();
        }
    }

    private static float relativePosition(Set<Connection> connections, Node node, boolean direction, Map<Integer,List<Node>> map) {
        int count = 0;
        float sum = 0;

        for (Connection connection : connections) {
            Node relative = relative(connection, node);
            if (relative == null)
                continue;

            if (direction == DOWN && relative.getRow() >= node.getRow())
                continue;

            if (direction == UP && relative.getRow() <= node.getRow())
                continue;

            count++;
            sum += position(map, relative);
        }

        //System.out.print(node + " " + (sum / (float)count) + " ");
        return count != 0 ? sum / (float)count : Integer.MAX_VALUE;
    }

    static Node relative(Connection connection, Node node) {
        Node otherNode = null;
        if (connection.getSource() == node)
            otherNode = connection.getTarget();
        else if (connection.getTarget() == node)
            otherNode = connection.getSource();

        if (otherNode != null)
            return otherNode;

        return null;
    }

    private static float position(Map<Integer, List<Node>> map, Node node) {
        List<Node> list = map.get(node.getRow());
        return (float)(list.indexOf(node) + 1) / (float)(list.size());
    }
}
