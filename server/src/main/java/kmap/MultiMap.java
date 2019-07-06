package kmap;

import java.util.*;

public class MultiMap<K, V>
{
    private final Map<K, Set<V>> multimap = new HashMap<>();

    public int size() {
        return multimap.size();
    }

    public boolean isEmpty() {
        return multimap.isEmpty();
    }

    public boolean containsKey(Object o) {
        return multimap.containsKey(o);
    }

    public Set<V> get(K key) {
        return multimap.getOrDefault(key, Collections.emptySet());
    }
    public void put(K key, V value) {
        multimap.computeIfAbsent(key, k -> new HashSet<>()).add(value);
    }

    public void remove(K key, V value) {
        this.multimap.computeIfPresent(key, (k, set) -> set.remove(value) && set.isEmpty() ? null : set);
    }

    public Set<V> remove(Object o) {
        return multimap.remove(o);
    }

    public void clear() {
        multimap.clear();
    }

    public Set<K> keySet() {
        return multimap.keySet();
    }

    public Set<Map.Entry<K, Set<V>>> entrySet() {
        return multimap.entrySet();
    }

    public Set<V> values() {
        return (Set<V>) multimap.values().stream().flatMap(Set::stream);
    }
}
