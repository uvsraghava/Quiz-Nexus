import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();
        
        if (!credentials?.email || !credentials?.password) return null;

        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("No user found with this email");
        
        const passwordsMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordsMatch) throw new Error("Incorrect password");
        
        // THE ADMIN GATE
        if (!user.isApproved) throw new Error("Account pending admin approval");

        return { 
          id: user._id.toString(), 
          name: user.name, 
          email: user.email, 
          role: user.role 
        };
      }
    })
  ],
  callbacks: {
    // Attach the user's role and ID to their active session token
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };