package com.example.splitwise.repository;

import com.example.splitwise.model.PendingInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PendingInvitationRepository extends MongoRepository<PendingInvitation, String> {

    List<PendingInvitation> findByInviteeEmail(String inviteeEmail);

    List<PendingInvitation> findByInviterUserId(String inviterUserId);

    List<PendingInvitation> findByInviteeUserId(String inviteeUserId);

    List<PendingInvitation> findByInviteeUserIdAndType(String inviteeUserId, PendingInvitation.InvitationType type);
}
