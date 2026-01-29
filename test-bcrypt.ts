import bcrypt from 'bcrypt';

async function test() {
    try {
        console.log("Testing bcrypt...");
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("test", salt);
        console.log("Hash generated:", hash);
        const match = await bcrypt.compare("test", hash);
        console.log("Match:", match);
        if (match) console.log("✅ bcrypt seems to be working correctly.");
        else console.log("❌ bcrypt comparison failed.");
    } catch (e: any) {
        console.error("❌ bcrypt FAILED:", e.message);
    }
    process.exit(0);
}

test();
