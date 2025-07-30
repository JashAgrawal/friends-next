/**
 * Test script to verify continue watching update functionality
 * This script tests that when a user watches different episodes of the same series,
 * it updates the existing entry rather than creating multiple entries.
 */

const API_BASE = 'http://localhost:3000/api';

async function testContinueWatchingUpdate() {
  console.log('🧪 Testing Continue Watching Update Functionality\n');

  // Mock session - in real app this would come from authentication
  const testData = {
    mediaId: 12345,
    mediaType: 'tv',
    title: 'Test Series',
    posterPath: '/test-poster.jpg'
  };

  try {
    console.log('1️⃣ Adding first episode (S1E1)...');
    const response1 = await fetch(`${API_BASE}/continue-watching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testData,
        seasonNumber: 1,
        episodeNumber: 1,
        serverId: 1
      })
    });

    if (!response1.ok) {
      throw new Error(`HTTP error! status: ${response1.status}`);
    }

    const result1 = await response1.json();
    console.log('✅ Added S1E1:', {
      id: result1.id,
      season: result1.seasonNumber,
      episode: result1.episodeNumber,
      serverId: result1.serverId
    });

    console.log('\n2️⃣ Getting continue watching list...');
    const getResponse1 = await fetch(`${API_BASE}/continue-watching`);
    const list1 = await getResponse1.json();
    console.log(`📋 Continue watching has ${list1.length} items`);

    console.log('\n3️⃣ Adding second episode (S1E2) - should UPDATE existing entry...');
    const response2 = await fetch(`${API_BASE}/continue-watching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testData,
        seasonNumber: 1,
        episodeNumber: 2,
        serverId: 2
      })
    });

    const result2 = await response2.json();
    console.log('✅ Updated to S1E2:', {
      id: result2.id,
      season: result2.seasonNumber,
      episode: result2.episodeNumber,
      serverId: result2.serverId
    });

    console.log('\n4️⃣ Getting continue watching list again...');
    const getResponse2 = await fetch(`${API_BASE}/continue-watching`);
    const list2 = await getResponse2.json();
    console.log(`📋 Continue watching has ${list2.length} items`);

    console.log('\n5️⃣ Adding third episode (S2E1) - should UPDATE existing entry...');
    const response3 = await fetch(`${API_BASE}/continue-watching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testData,
        seasonNumber: 2,
        episodeNumber: 1,
        serverId: 3
      })
    });

    const result3 = await response3.json();
    console.log('✅ Updated to S2E1:', {
      id: result3.id,
      season: result3.seasonNumber,
      episode: result3.episodeNumber,
      serverId: result3.serverId
    });

    console.log('\n6️⃣ Final continue watching list...');
    const getResponse3 = await fetch(`${API_BASE}/continue-watching`);
    const list3 = await getResponse3.json();
    console.log(`📋 Continue watching has ${list3.length} items`);

    // Verify results
    if (list3.length === 1) {
      const item = list3[0];
      if (item.mediaId === testData.mediaId && 
          item.seasonNumber === 2 && 
          item.episodeNumber === 1 &&
          item.serverId === 3) {
        console.log('\n🎉 SUCCESS: Continue watching correctly updated the same entry!');
        console.log('Final entry:', {
          mediaId: item.mediaId,
          title: item.title,
          season: item.seasonNumber,
          episode: item.episodeNumber,
          serverId: item.serverId
        });
      } else {
        console.log('\n❌ FAILURE: Entry was not updated correctly');
        console.log('Expected: S2E1 with serverId 3');
        console.log('Got:', item);
      }
    } else {
      console.log('\n❌ FAILURE: Should have exactly 1 entry, but got', list3.length);
      console.log('Entries:', list3);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await fetch(`${API_BASE}/continue-watching`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaId: testData.mediaId,
        mediaType: testData.mediaType
      })
    });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.log('\n💡 Note: This test requires authentication. Make sure you:');
      console.log('   1. Have a user logged in');
      console.log('   2. Have an active profile set');
      console.log('   3. Are running the development server');
    }
  }
}

// Run the test
testContinueWatchingUpdate();