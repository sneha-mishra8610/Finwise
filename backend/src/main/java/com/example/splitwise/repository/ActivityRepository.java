package com.example.splitwise.repository;

import com.example.splitwise.model.Activity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends MongoRepository<Activity, String> {

    List<Activity> findByUserIdOrderByCreatedAtDesc(String userId, org.springframework.data.domain.Pageable pageable);

    boolean existsByRelatedExpenseIdAndUserIdAndType(String relatedExpenseId, String userId, Activity.ActivityType type);

    Optional<Activity> findTopByUserIdAndRelatedExpenseIdAndTypeOrderByCreatedAtDesc(
            String userId, String relatedExpenseId, Activity.ActivityType type);

    List<Activity> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    long countByUserIdAndReadFalse(String userId);

    List<Activity> findByUserIdAndIdIn(String userId, List<String> ids);
}
