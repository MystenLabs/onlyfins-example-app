// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Simple post module for OnlyFins Phase 1 (no encryption)
module posts::posts {
    use std::string::String;
    use sui::clock::Clock;
    use sui::coin::Coin;
    use sui::sui::SUI;

    /// A shared post object
    public struct Post has key {
        id: UID,
        author: address,
        caption: String,
        image_blob_id: String,
        created_at: u64,
        encryption_id: Option<vector<u8>>
    }

    public struct ViewerToken has key, store {
        id: UID,
        post_id: ID
    }

    /// Create and share a Post object
    public fun create_post(
        caption: String,
        image_blob_id: String,
        encryption_id: Option<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let post = Post {
            id: object::new(ctx),
            author: ctx.sender(),
            caption,
            image_blob_id,
            created_at: clock.timestamp_ms(),
            encryption_id,
        };
        transfer::share_object(post);
    }

    public fun grant_access(
        post: &Post, 
        ctx: &mut TxContext
    ): ViewerToken {
        ViewerToken { id: object::new(ctx), post_id: post.id.to_inner() }
    }
    
    public entry fun seal_approve_access(
        encryption_id: vector<u8>,  // Not needed with ViewerToken, but Seal expects it
        post: &Post,
        viewer_token: &ViewerToken,
        ctx: &TxContext
    ) {
        // Verify encryption_id matches post's encryption_id
        assert!(post.encryption_id.is_some(), 0);
        assert!(*post.encryption_id.borrow() == encryption_id, 1);
        
        // Check if caller is post author (free access)
        if (ctx.sender() == post.author) {
            return
        };
        
        // Check if ViewerToken matches this post
        assert!(viewer_token.post_id == object::id(post), 2);
    }
}
