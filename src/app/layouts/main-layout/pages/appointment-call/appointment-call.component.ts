import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveOffcanvas, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { MessageService } from 'src/app/@shared/services/message.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { ProfileChatsListComponent } from 'src/app/layouts/main-layout/pages/profile-chats/profile-chats-list/profile-chats-list.component';
import { ProfileChatsSidebarComponent } from 'src/app/layouts/main-layout/pages/profile-chats/profile-chats-sidebar/profile-chats-sidebar.component';

declare var JitsiMeetExternalAPI: any;
@Component({
  selector: 'app-appointment-call',
  templateUrl: './appointment-call.component.html',
  styleUrls: ['./appointment-call.component.scss'],
})
export class AppointmentCallComponent implements OnInit {
  appointmentCall: SafeResourceUrl;
  domain: string = 'meet.facetime.tube';
  options: any;
  api: any;
  conferenceJoinedListener: any;
  userChat: any = {};
  isLeftSidebarOpen: boolean = false;
  isRightSidebarOpen: boolean = false;
  selectedRoomId: number;
  isRoomCreated: boolean = false;
  openChatId: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offcanvasService: NgbOffcanvas,
    private sharedService: SharedService,
    private messageService: MessageService,
    private seoService: SeoService,
    public tokenService: TokenStorageService
  ) {
    const data = {
      title: 'Reefer.social Chat',
      url: `${location.href}`,
      description: '',
    };
    this.seoService.updateSeoMetaData(data);
  }

  ngOnInit() {
    const stateData = window.history.state.chatDataPass;
    if (stateData) {
      this.openChatId = {
        roomId: stateData.roomId,
        groupId: stateData.groupId,
      };
    }
    const appointmentURLCall =
      this.route.snapshot['_routerState'].url.split('/call/')[1];
    this.options = {
      roomName: appointmentURLCall,
      parentNode: document.querySelector('#meet'),
      configOverwrite: {
        startWithVideoMuted: true,
        defaultLanguage: 'en',
      },
      enableNoAudioDetection: true,
      enableNoisyMicDetection: true,
    };

    const api = new JitsiMeetExternalAPI(this.domain, this.options);
    const numberOfParticipants = api.getNumberOfParticipants();
    const iframe = api.getIFrame();

    api.on('readyToClose', () => {
      this.router.navigate(['/profile-chats']).then(() => {
      });
    });

    this.initialChat();
  }

  initialChat() {
    // console.log('opendChat', this.openChatId);
    if (this.openChatId.roomId) {
      this.messageService.getRoomById(this.openChatId.roomId).subscribe({
        next: (res: any) => {
          this.userChat = res.data[0];
          // console.log(this.userChat);
        },
        error: () => {},
      });
    }
    if (this.openChatId.groupId) {
      this.messageService.getGroupById(this.openChatId.groupId).subscribe({
        next: (res: any) => {
          this.userChat = res.data;
          this.userChat['isAccepted'] = 'Y';
          // console.log(this.userChat);
        },
        error: () => {},
      });
    }
  }

  onChatPost(userName: any) {
    this.userChat = userName;
    this.openRightSidebar();
  }

  openChatListSidebar() {
    this.isLeftSidebarOpen = true;
    const offcanvasRef = this.offcanvasService.open(
      ProfileChatsSidebarComponent,
      this.userChat
    );
    offcanvasRef.result
      .then((result) => {})
      .catch((reason) => {
        this.isLeftSidebarOpen = false;
      });
    offcanvasRef.componentInstance.onNewChat.subscribe((emittedData: any) => {
      this.onChatPost(emittedData);
    });
  }

  openRightSidebar() {
    this.isRightSidebarOpen = true;
    const offcanvasRef = this.offcanvasService.open(ProfileChatsListComponent, {
      position: 'end',
      panelClass: window.innerWidth < 500 ? 'w-340-px' : 'w-400-px',
    });
    offcanvasRef.componentInstance.userChat = this.userChat;
    offcanvasRef.componentInstance.sidebarClass = this.isRightSidebarOpen;
    offcanvasRef.result
      .then((result) => {})
      .catch((reason) => {
        this.isRightSidebarOpen = false;
      });
  }

  onNewChatRoom(isRoomCreated) {
    this.isRoomCreated = isRoomCreated;
    return this.sharedService.updateIsRoomCreated(this.isRoomCreated);
  }

  onSelectChat(id) {
    this.selectedRoomId = id;
  }
}
