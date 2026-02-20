const BASE_URL = 'http://localhost:3000/api/rent-computer';

async function testDuration() {
    console.log('🚀 Testing Rental Duration & Extension...');
    let rentalId;

    // 1. Create Rental with default 120 mins
    console.log('\n1. Creating Rental...');
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_no: '001',
                member_name: 'Duration Test',
                member_type: 'Test',
                education: 'Test',
                job: 'Test',
                pc_number: 9, // Using a different PC
                notes: 'Duration test',
                duration: 120 // explicit
            })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Created:', data.data);
            rentalId = data.data.id;
            
            if (data.data.duration !== 120) console.error('❌ Duration mismatch!');
        } else {
            console.error('❌ Create Failed:', data);
            return; // Stop if create failed
        }
    } catch (error) {
        console.error('❌ Create Error:', error.message);
        return;
    }

    // 2. Extend Rental by 30 mins
    console.log(`\n2. Extending Rental ${rentalId} by 30 mins...`);
    try {
        const response = await fetch(`${BASE_URL}/${rentalId}/extend`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minutes: 30 })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Extended Success');
        } else {
            console.error('❌ Extend Failed:', data);
        }
    } catch (error) {
        console.error('❌ Extend Error:', error.message);
    }
    
    // 3. Verify New Duration via Active List
    console.log('\n3. Verifying New Duration...');
    try {
        const response = await fetch(`${BASE_URL}/active`);
        const data = await response.json();
        
        const myRental = data.data.find(r => r.id === rentalId);
        if (myRental) {
            console.log('✅ Rental Found:', myRental);
            if (myRental.duration === 150) {
                 console.log('✅ Duration Updated Correctly to 150 mins');
            } else {
                 console.error(`❌ Duration Validtion Failed. Expected 150, got ${myRental.duration}`);
            }
            
            // Cleanup: Complete the rental
            await fetch(`${BASE_URL}/${rentalId}/complete`, { method: 'PUT' });
        } else {
            console.error('❌ Rental not found in active list');
        }
    } catch (error) {
        console.error('❌ Verification Error:', error.message);
    }
}

testDuration();
