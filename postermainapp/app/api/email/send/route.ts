import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, subject, text, code } = body;

        // Setup email data
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2b6cb0;">Judge Assignment Confirmation</h1>
                    <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="font-size: 16px; line-height: 1.5;">Dear Professor,</p>
                        <p style="font-size: 16px; line-height: 1.5;">${text}</p>
                        <p style="font-size: 16px; line-height: 1.5;">Your judge code is: <strong>${code}</strong></p>
                        <p style="font-size: 16px; line-height: 1.5;">Please log in to the judging portal using your email address.</p>
                        <p style="font-size: 16px; line-height: 1.5;">Login URL: <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="color: #2b6cb0;">${process.env.NEXT_PUBLIC_APP_URL}/login</a></p>
                    </div>
                    <p style="color: #718096; font-size: 14px;">This is an automated message, please do not reply.</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: 'Email sent successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
