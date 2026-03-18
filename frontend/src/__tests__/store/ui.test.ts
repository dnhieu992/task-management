// frontend/src/__tests__/store/ui.test.ts
import { act } from '@testing-library/react';
import { useUIStore } from '@/store/ui';

// Reset store between tests
beforeEach(() => {
  useUIStore.setState({
    sidebarOpen: true,
    activeTaskId: null,
  });
});

describe('useUIStore', () => {
  it('has correct initial state', () => {
    const { sidebarOpen, activeTaskId } = useUIStore.getState();
    expect(sidebarOpen).toBe(true);
    expect(activeTaskId).toBeNull();
  });

  it('toggleSidebar flips sidebarOpen', () => {
    act(() => useUIStore.getState().toggleSidebar());
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    act(() => useUIStore.getState().toggleSidebar());
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('setActiveTask sets and clears activeTaskId', () => {
    act(() => useUIStore.getState().setActiveTask('task-123'));
    expect(useUIStore.getState().activeTaskId).toBe('task-123');

    act(() => useUIStore.getState().setActiveTask(null));
    expect(useUIStore.getState().activeTaskId).toBeNull();
  });
});
