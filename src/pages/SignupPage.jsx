// import { memo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Signup from '../components/auth/Signup';

// const SignupPage = memo(() => {
//   const navigate = useNavigate();

//   const handleClose = (nextMode, message) => {
//     if (nextMode === 'login') {
//       navigate('/login', { state: { successMessage: message } });
//     } else {
//       navigate('/');
//     }
//   };

//   return (
//     <Signup onClose={handleClose} isModal={false} />
//   );
// });

// SignupPage.displayName = 'SignupPage';

// export default SignupPage;