require('dotenv').config();
const AdminSeeder = require('../seeders/adminSeeder');

console.log('🌱 Database Seeder Started...');


process.on('SIGINT', () => {
    console.log('\n🛑 Seeder interrupted by user');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Seeder terminated');
    process.exit(0);
});


AdminSeeder.run().catch((error) => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
});