import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    minlength: 5, 
    maxlength: 100,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    minlength: 10 
  },
  // Custom Validator for tags (based on the video you are watching)
  tags: {
    type: Array,
    validate: {
      validator: function(v) {
        return v && v.length > 0; // Ensures the community has at least one tag
      },
      message: 'A community should have at least one tag.'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isPrivate: { 
    type: Boolean, 
    default: false 
  }
});

const Community = mongoose.model('Community', communitySchema);

// Example function to create a community with validation handling
async function createCommunity() {
  const community = new Community({
    name: 'CS Graduates 2026',
    description: 'A community for Alexandria University CS students.',
    tags: ['education', 'tech'],
    isPrivate: true
  });

  try {
    const result = await community.save();
    console.log('Community created successfully:', result);
  } catch (error) {
    // Loop through validation errors and print messages
    for (let field in error.errors) {
      console.log('Validation Error:', error.errors[field].message);
    }
  }
}

// createCommunity(); // Uncomment to test the creation

export default Community;