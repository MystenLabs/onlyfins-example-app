// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Simple post module for OnlyFins Phase 1 (no encryption)
module posts::posts {
    use std::string::String;
    use sui::clock::Clock;

    /// A shared post object
    public struct Post has key {
        id: UID,
        author: address,
        caption: String,
        image_blob_id: String,  // Walrus blob ID (unencrypted)
        created_at: u64,
    }

    /// Create and share a Post object
    public fun create_post(
        caption: String,
        image_blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let post = Post {
            id: object::new(ctx),
            author: ctx.sender(),
            caption,
            image_blob_id,
            created_at: clock.timestamp_ms(),
        };
        transfer::share_object(post);
    }
}
