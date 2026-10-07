import { provideRouter } from '@angular/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TableCellDirective } from './table-cell.directive';
import { TableComponent } from './table';
import { TableConfig, TableRowReorderEvent } from './table.model';

interface TestUser {
  name: string;
  avatar: string;
  verified: boolean;
}

const TEST_USERS: TestUser[] = [
  { name: 'Mia', avatar: '/mia.jpg', verified: true },
  { name: 'Noah', avatar: '/noah.jpg', verified: false },
];

@Component({
  imports: [TableComponent, TableCellDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hui-table [config]="config" (rowReorder)="outputEvents.push($event)">
      <ng-template huiTableCell="name" let-user="row">
        <div class="custom-user-cell">
          <img [src]="user.avatar" [alt]="user.name" />
          <span>{{ user.name }}</span>
        </div>
      </ng-template>
    </hui-table>
  `,
})
class TableTestHost {
  readonly callbackEvents: TableRowReorderEvent<TestUser>[] = [];
  readonly outputEvents: TableRowReorderEvent<TestUser>[] = [];
  readonly config: TableConfig<TestUser> = {
    columns: [
      { key: 'name', label: 'User', type: 'template' },
      {
        key: 'verified',
        label: 'Verified',
        type: 'icon',
        align: 'center',
        headerAlign: 'right',
        icon: (verified) => (verified ? 'rosette-discount-check' : 'close-x'),
        iconClass: (verified) => (verified ? 'verified-icon' : 'unverified-icon'),
        iconLabel: (verified) => (verified ? 'Verified' : 'Not verified'),
      },
    ],
    data: TEST_USERS,
    rowKey: 'name',
    hoverable: true,
    selection: {
      mode: 'multiple',
      selectedRows: [TEST_USERS[0]],
    },
    stickyHeader: true,
    maxHeight: '320px',
    rowReorder: {
      enabled: true,
      onReorder: (event) => this.callbackEvents.push(event),
    },
  };
}

describe('TableComponent', () => {
  it('uses the artist list sticky height by default', async () => {
    const fixture = TestBed.createComponent(TableComponent<TestUser>);
    fixture.componentRef.setInput('config', {
      columns: [{ key: 'name', label: 'Name' }],
      data: TEST_USERS,
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.table-scroll-container').style.maxHeight).toBe(
      '600px',
    );
    expect(fixture.nativeElement.querySelector('th').classList.contains('sticky')).toBe(true);
  });

  it('groups actions and existing submenus while preserving permissions and callbacks', async () => {
    const edit = vi.fn();
    const fixture = TestBed.createComponent(TableComponent<TestUser>);
    fixture.componentRef.setInput('config', {
      columns: [{ key: 'name', label: 'Name' }],
      data: [TEST_USERS[0]],
      actions: [
        { label: 'Edit', icon: 'edit', onClick: edit },
        { label: 'Hidden', hidden: () => true },
        {
          label: 'Manage',
          disabled: () => true,
          submenu: [{ label: 'Delete', icon: 'delete', variant: 'danger' }],
        },
      ],
    } satisfies TableConfig<TestUser>);
    await fixture.whenStable();
    const buttons = fixture.nativeElement.querySelectorAll('tbody button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('aria-label')).toBe('More actions');
    buttons[0].click();
    await fixture.whenStable();
    const items = fixture.nativeElement.querySelectorAll('.table-dropdown-menu button');
    expect(items.length).toBe(2);
    expect(items[1].disabled).toBe(true);
    items[0].click();
    await fixture.whenStable();
    expect(edit).toHaveBeenCalledWith(TEST_USERS[0], 0);
    expect(fixture.nativeElement.querySelector('.table-dropdown-menu')).toBeNull();
  });

  it('does not render a more trigger when every action is hidden', async () => {
    const fixture = TestBed.createComponent(TableComponent<TestUser>);
    fixture.componentRef.setInput('config', {
      columns: [{ key: 'name', label: 'Name' }],
      data: TEST_USERS,
      actions: [{ label: 'More', submenu: [{ label: 'Edit', hidden: () => true }] }],
    } satisfies TableConfig<TestUser>);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('tbody button')).toBeNull();
  });

  it('renders projected custom content for a keyed column', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const cell = fixture.nativeElement.querySelector('.custom-user-cell') as HTMLElement;
    const image = cell.querySelector('img') as HTMLImageElement;

    expect(cell.textContent).toContain('Mia');
    expect(image.getAttribute('src')).toBe('/mia.jpg');
    expect(image.getAttribute('alt')).toBe('Mia');
  });

  it('renders conditional icons with accessible labels', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const verifiedIcon = fixture.nativeElement.querySelector(
      'hui-icon[aria-label="Verified"]',
    ) as HTMLElement;
    const unverifiedIcon = fixture.nativeElement.querySelector(
      'hui-icon[aria-label="Not verified"]',
    ) as HTMLElement;

    expect(verifiedIcon.classList.contains('verified-icon')).toBe(true);
    expect(unverifiedIcon.classList.contains('unverified-icon')).toBe(true);
  });

  it('keeps the header sticky inside the configured scroll height', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const scrollContainer = fixture.nativeElement.querySelector(
      'hui-table > div > div.overflow-x-auto',
    ) as HTMLElement;
    const header = fixture.nativeElement.querySelector('thead th') as HTMLElement;

    expect(scrollContainer.style.maxHeight).toBe('320px');
    expect(scrollContainer.classList.contains('overflow-y-auto')).toBe(true);
    expect(header.classList.contains('sticky')).toBe(true);
  });

  it('aligns header content independently from its cells', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const verifiedHeader = Array.from(
      fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLElement>,
    ).find((header) => header.textContent?.includes('Verified')) as HTMLElement;
    const headerContent = verifiedHeader.querySelector('div') as HTMLElement;
    const verifiedCell = fixture.nativeElement
      .querySelector('hui-icon[aria-label="Verified"]')
      .closest('td') as HTMLElement;

    expect(verifiedHeader.classList.contains('text-right')).toBe(true);
    expect(headerContent.classList.contains('justify-end')).toBe(true);
    expect(verifiedCell.classList.contains('text-center')).toBe(true);
  });

  it('adds the sticky-header shadow only after vertical scrolling', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const scrollContainer = fixture.nativeElement.querySelector(
      '.table-scroll-container',
    ) as HTMLElement;
    const tableHeader = fixture.nativeElement.querySelector('thead') as HTMLElement;

    expect(tableHeader.classList.contains('table-header-scrolled')).toBe(false);

    scrollContainer.scrollTop = 24;
    scrollContainer.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(tableHeader.classList.contains('table-header-scrolled')).toBe(true);

    scrollContainer.scrollTop = 0;
    scrollContainer.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(tableHeader.classList.contains('table-header-scrolled')).toBe(false);
  });

  it('can hide the table header', async () => {
    await TestBed.configureTestingModule({ imports: [TableComponent] }).compileComponents();

    const fixture = TestBed.createComponent(TableComponent<TestUser>);
    fixture.componentRef.setInput('config', {
      columns: [{ key: 'name', label: 'User' }],
      data: TEST_USERS,
      showHeader: false,
    } satisfies TableConfig<TestUser>);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('thead')).toBeNull();
  });

  it('can reveal the table header only after scrolling the list', async () => {
    await TestBed.configureTestingModule({ imports: [TableComponent] }).compileComponents();

    const fixture = TestBed.createComponent(TableComponent<TestUser>);
    fixture.componentRef.setInput('config', {
      columns: [{ key: 'name', label: 'User' }],
      data: TEST_USERS,
      stickyHeader: true,
      showHeader: false,
      showHeaderOnlyOnScroll: true,
    } satisfies TableConfig<TestUser>);
    await fixture.whenStable();

    const scrollContainer = fixture.nativeElement.querySelector(
      '.table-scroll-container',
    ) as HTMLElement;
    const tableHeader = fixture.nativeElement.querySelector('thead') as HTMLElement;

    expect(tableHeader.classList.contains('table-header-visible')).toBe(false);

    scrollContainer.scrollTop = 12;
    scrollContainer.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(tableHeader.classList.contains('table-header-visible')).toBe(true);
  });

  it('uses separate neutral states for hover and selection', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLElement>;

    expect(rows[0].classList.contains('table-row-hoverable')).toBe(true);
    expect(rows[0].classList.contains('table-row-selected')).toBe(true);
    expect(rows[0].classList.contains('bg-primary/10')).toBe(false);
    expect(rows[1].classList.contains('table-row-selected')).toBe(false);
  });

  it('reorders rows and invokes both reorder callback APIs', async () => {
    await TestBed.configureTestingModule({ imports: [TableTestHost] }).compileComponents();

    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLElement>;
    const dragHandle = rows[0].querySelector('button[draggable="true"]') as HTMLButtonElement;
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
    };
    const dragStart = new Event('dragstart', { bubbles: true, cancelable: true });
    Object.defineProperty(dragStart, 'dataTransfer', { value: dataTransfer });
    dragHandle.dispatchEvent(dragStart);

    const dragOver = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(dragOver, 'dataTransfer', { value: dataTransfer });
    rows[1].dispatchEvent(dragOver);
    rows[1].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    const names = Array.from(
      fixture.nativeElement.querySelectorAll('.custom-user-cell span') as NodeListOf<HTMLElement>,
    ).map((element) => element.textContent?.trim());
    const host = fixture.componentInstance;

    expect(names).toEqual(['Noah', 'Mia']);
    expect(host.callbackEvents[0]).toMatchObject({ previousIndex: 0, currentIndex: 1 });
    expect(host.outputEvents[0]).toMatchObject({ previousIndex: 0, currentIndex: 1 });
    expect(host.callbackEvents[0].data.map((row) => row.name)).toEqual(['Noah', 'Mia']);
  });

  it('keeps a disabled reorder handle visible and reports interaction attempts', async () => {
    const onDisabledAttempt = vi.fn();
    await TestBed.configureTestingModule({ imports: [TableComponent] }).compileComponents();

    const fixture = TestBed.createComponent(TableComponent<TestUser>);
    fixture.componentRef.setInput('config', {
      columns: [{ key: 'name', label: 'User' }],
      data: TEST_USERS,
      rowKey: 'name',
      rowReorder: {
        enabled: true,
        disabled: () => true,
        onDisabledAttempt,
      },
    } satisfies TableConfig<TestUser>);
    await fixture.whenStable();

    const dragHandle = fixture.nativeElement.querySelector(
      'tbody button[aria-disabled="true"]',
    ) as HTMLButtonElement;

    expect(dragHandle).not.toBeNull();
    expect(dragHandle.getAttribute('draggable')).toBe('false');

    dragHandle.click();
    await fixture.whenStable();

    expect(onDisabledAttempt).toHaveBeenCalledOnce();
    expect(onDisabledAttempt).toHaveBeenCalledWith(TEST_USERS[0], 0);
  });
});

describe('Table relationship navigation', () => {
  it('renders a detail anchor for a user reference and leaves missing references unlinked', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TableComponent);
    fixture.componentRef.setInput('config', {
      columns: [
        {
          key: 'user.displayName',
          label: 'User',
          linkGenerator: (row: { user: { id?: string } }) =>
            row.user.id ? `/users/${row.user.id}` : null,
        },
      ],
      data: [{ user: { id: 'u1', displayName: 'Mia' } }, { user: { displayName: 'Deleted user' } }],
    });
    await fixture.whenStable();
    const anchors = fixture.nativeElement.querySelectorAll('td a');
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toBe('/users/u1');
    expect(anchors[0].textContent).toContain('Mia');
  });
});
