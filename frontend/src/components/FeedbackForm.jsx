import React, { useState } from 'react';
import axios from '../utils/axios';

const FeedbackForm = ({ bookingId, carId, onFeedbackSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/feedback', {
        bookingId,
        rating,
        comment
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setError(null);
      
      // Notify parent component
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Rate your experience</h3>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                ★
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {rating > 0 ? `Selected: ${rating} star${rating !== 1 ? 's' : ''}` : 'Click to rate'}
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Your Comment
          </label>
          <textarea
            id="comment"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Share your experience with this rental..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || rating === 0}
          className={`px-4 py-2 rounded-md text-white ${
            loading || rating === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;