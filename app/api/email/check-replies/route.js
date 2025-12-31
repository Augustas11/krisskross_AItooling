import { NextResponse } from 'next/server';
import { checkForReplies } from '../../../../email-automation/index';

export async function POST() {
    try {
        console.log('🔄 Manual reply check triggered from UI');

        // Run the reply checker logic
        // Note: checkForReplies is async and returns void, but logs internally.
        // We might want to modify it to return stats, but for now we just wait for it.
        await checkForReplies();

        return NextResponse.json({
            success: true,
            message: 'Reply check completed successfully'
        });
    } catch (error) {
        console.error('❌ Error in manual reply check:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
