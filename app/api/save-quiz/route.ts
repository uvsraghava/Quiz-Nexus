import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import User from '@/models/User';
import { sendMail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const { 
      title, subject, duration, questions, adminEmail, 
      startTime, testType, caseStudyText, maxMarks,
      isGlobal, eligibleUsers 
    } = body;

    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const newTest = await Test.create({
      title, subject, duration, startTime,
      testType: testType || 'mcq',
      caseStudyText, maxMarks, questions,
      createdBy: adminUser._id,
      isGlobal: isGlobal !== undefined ? isGlobal : true,
      eligibleUsers: eligibleUsers || []
    });

    // EMAIL BLAST LOGIC
    try {
      const approvedUsers = await User.find({ isApproved: true }).select('email');
      let emailList = approvedUsers.map(user => user.email);

      if (isGlobal === false && eligibleUsers && eligibleUsers.length > 0) {
        emailList = emailList.filter(email => eligibleUsers.includes(email));
      }

      if (emailList.length > 0) {
        const testMarks = testType === 'descriptive' ? maxMarks : questions.length;
        const timeString = startTime ? new Date(startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'IMMEDIATE DEPLOYMENT';

        const electiveBadge = isGlobal === false 
          ? `<span style="background-color: #a855f7; color: #18181b; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-bottom: 10px; display: inline-block;">TARGETED ELECTIVE</span>` 
          : '';

        // UPGRADED: Dynamic URL generation for the direct link
        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const testLink = `${protocol}://${host}/test/${newTest._id}`;

        const emailHtml = `
          <div style="font-family: monospace; max-w: 600px; margin: 0 auto; background-color: #09090b; color: #e4e4e7; padding: 30px; border-radius: 10px; border: 1px solid #27272a;">
            <h1 style="color: #f43f5e; text-transform: uppercase; letter-spacing: 2px;">Protocol Deployed</h1>
            <p style="font-size: 16px;">A new assessment matrix has been deployed by Command.</p>
            
            <div style="background-color: #18181b; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0;">
              ${electiveBadge}
              <h2 style="margin-top: 0; color: #f97316;">${title}</h2>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Duration:</strong> ${duration} Minutes</p>
              <p><strong>Max Score:</strong> ${testMarks} Points</p>
              <p><strong>Type:</strong> ${testType === 'descriptive' ? 'Subjective Case Study' : 'MCQ Matrix'}</p>
              <br/>
              <p style="color: #fbbf24; font-weight: bold;"><strong>Scheduled For (IST):</strong> ${timeString}</p>
            </div>
            
            <p>Access the Nexus Command dashboard to stand by for launch, or click below to directly enter the matrix.</p>
            
            <div style="margin-top: 30px;">
              <a href="${testLink}" style="background-color: #f43f5e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif; display: inline-block;">ENTER MATRIX</a>
            </div>
          </div>
        `;

        await sendMail({
          bcc: emailList,
          subject: `[QUIZ NEXUS] Assessment Alert: ${title}`,
          html: emailHtml
        });
      }
    } catch (mailError) {
      console.error("Transmission blast failed, but protocol deployed:", mailError);
    }

    return NextResponse.json({ message: 'Protocol deployed successfully', test: newTest }, { status: 201 });
  } catch (error) {
    console.error('Error deploying protocol:', error);
    return NextResponse.json({ message: 'Failed to deploy protocol' }, { status: 500 });
  }
}