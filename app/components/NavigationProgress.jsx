import {useNavigation} from 'react-router';

export function NavigationProgress() {
  const navigation = useNavigation();
  const isLoading =
    navigation.state === 'loading' || navigation.state === 'submitting';

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 z-[9999] h-[3px] bg-[#06B6D4] transition-all duration-300 ease-out ${
        isLoading ? 'w-4/5 opacity-100' : 'w-0 opacity-0'
      }`}
      style={{
        boxShadow: isLoading ? '0 0 8px rgba(6, 182, 212, 0.6)' : 'none',
      }}
    />
  );
}
