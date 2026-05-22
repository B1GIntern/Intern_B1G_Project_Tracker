import { Router } from 'express';
import { db } from '../config/db';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const router = Router();

// Create Supabase admin client
const supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Check for orphaned users (in auth but not in profile table)
router.get('/check-orphaned', async (req, res) => {
    try {
        // Get all users from Supabase auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
            throw new Error(authError.message);
        }

        // Get all users from profile table
        const profileResult = await db.query(`
            SELECT id, email FROM profile
        `);

        const profileEmails = new Set(profileResult.rows.map(p => p.email));
        const authEmails = new Set(authUsers.users.map(u => u.email));

        // Find users in auth but not in profile
        const orphanedUsers = authUsers.users.filter((user: any) => 
            !profileEmails.has(user.email)
        );

        // Find users in profile but not in auth
        const ghostProfiles = profileResult.rows.filter((profile: any) =>
            !authEmails.has(profile.email)
        );

        res.json({
            success: true,
            data: {
                totalAuthUsers: authUsers.users.length,
                totalProfileUsers: profileResult.rows.length,
                orphanedUsers: orphanedUsers.map(u => ({
                    id: u.id,
                    email: u.email,
                    created_at: u.created_at
                })),
                ghostProfiles: ghostProfiles.map(p => ({
                    id: p.id,
                    email: p.email
                }))
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Clean up orphaned users
router.delete('/cleanup-orphaned', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Get user from auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
            throw new Error(authError.message);
        }

        const userToDelete = authUsers.users.find((u: any) => u.email === email);
        
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                error: 'User not found in auth system'
            });
        }

        // Delete from auth system
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
        
        if (deleteError) {
            throw new Error(deleteError.message);
        }

        res.json({
            success: true,
            message: `User ${email} removed from auth system`,
            deletedUser: {
                id: userToDelete.id,
                email: userToDelete.email
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
