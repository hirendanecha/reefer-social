import { Component, HostListener, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddCommunityModalComponent } from './add-community-modal/add-community-modal.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommunityService } from 'src/app/@shared/services/community.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { CustomerService } from 'src/app/@shared/services/customer.service';

@Component({
  selector: 'app-communities',
  templateUrl: './communities.component.html',
  styleUrls: ['./communities.component.scss'],
})
export class CommunitiesComponent implements OnInit {
  activeIdTab: string = 'local';
  communities: any = [];
  isCommunityLoader: boolean = false;
  isCountryChecked: boolean = true;
  profileId: number = null;
  selectedCountry = 'US';
  allCountryData: any;
  allStateData: any;
  selectedState = '';
  searchByState = '';

  activePage = 0;
  isLoading = false;
  hasMoreData = false;
  routeData: any = {};

  constructor(
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private communityService: CommunityService,
    private seoService: SeoService,
    private router: Router,
    private customerService: CustomerService
  ) {
    this.profileId = Number(localStorage.getItem('profileId'));
    console.log(history.state.data);
    if (history.state.data) {
      this.routeData = history.state.data;
      this.loadMore(this.routeData);
    } else {
      this.loadMore({});
    }
    // this.getCommunities();
    const data = {
      title: 'Dispensaries & Wholesale',
      url: `${window.location.href}`,
      description: '',
    };
    this.seoService.updateSeoMetaData(data);
  }
  ngOnInit(): void {
    this.getAllCountries();
  }

  getCommunities(): void {
    let getCommunitiesObs = null;
    this.communities = [];

    if (this.activeIdTab === 'joined') {
      getCommunitiesObs = this.communityService.getJoinedCommunityByProfileId(
        this.profileId,
        'community'
      );
    } else if (this.activeIdTab === 'local') {
      getCommunitiesObs = this.communityService.getCommunity(
        this.profileId,
        'community'
      );
    } else {
      getCommunitiesObs = this.communityService.getCommunityByUserId(
        this.profileId,
        'community'
      );
    }
    this.isCommunityLoader = true;
    getCommunitiesObs?.subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.communities = res?.data;
        } else {
          this.communities = [];
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.isCommunityLoader = false;
      },
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    if (this.router.url.includes('dispensaries-wholesale')) {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const thresholdFraction = 0.2;
      const threshold = windowHeight * thresholdFraction;

      if (scrollY + windowHeight >= documentHeight - threshold) {
        if (!this.isLoading && !this.hasMoreData && !this.searchByState) {
          this.loadMore(this.routeData);
        }
      }
    }
  }

  loadMore(data): void {
    this.isCommunityLoader = true;
    this.isLoading = true;
    this.activePage = this.activePage + 1;
    const updatedData = {
      dispensaryName: data.dispensaryName,
      selectedCountry: data.selectedCountry,
      selectedState: data.selectedState,
      zipCode: data.zipCode,
      page: this.activePage,
      size: 10,
    };
    this.getAllCommunities(updatedData);
  }

  getAllCommunities(data: any): void {
    this.isCommunityLoader = true;
    this.communityService.getAllCommunities(data).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isCommunityLoader = false;
        if (res?.length > 0) {
          this.communities = [...this.communities, ...res];
        } else {
          this.hasMoreData = true;
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.isCommunityLoader = false;
      },
    });
  }
  onUserName(event: any) {
    const searchTerm = event.target.value;
    // this.communities = this.communities.filter((community: any) => {
    //   return community.name.toLowerCase().includes(searchTerm.toLowerCase());
    // });
    this.searchDispensaries(searchTerm);
  }

  searchDispensaries(searchText): void {
    const searchData = {
      dispensaryName: searchText,
      selectedCountry: null,
      selectedState: this.searchByState,
      zipCode: null,
      page: 1,
      size: 40,
    };
    this.communityService.getAllCommunities(searchData).subscribe({
      next: (res: any) => {
        if (res?.length > 0) {
          this.communities = res;
        } else {
          this.communities = [];
        }
      },
      error: () => {
        this.communities = [];
      },
    });
  }

  changeCountry() {
    if (this.isCountryChecked) {
      this.getAllState();
    }
  }
  getAllState() {
    this.spinner.show();
    const selectCountry = this.selectedCountry;
    this.customerService.getStateData(selectCountry).subscribe({
      next: (result) => {
        this.spinner.hide();
        this.allStateData = result;
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }
  getAllCountries() {
    this.spinner.show();
    this.customerService.getCountriesData().subscribe({
      next: (result) => {
        this.spinner.hide();
        // this.allCountryData = result;
        this.allCountryData = result.filter(
          (country) =>
            country.country_code === 'US' || country.country_code === 'CA'
        );
        this.getAllState();
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  createCommunity() {
    this.router.navigate(['dispensaries-wholesale/add-practitioner']);
  }
  // createCommunity() {
  //   const modalRef = this.modalService.open(AddCommunityModalComponent, {
  //     centered: true,
  //     backdrop: 'static',
  //     keyboard: false,
  //     size: 'lg'
  //   });
  //   modalRef.componentInstance.cancelButtonLabel = 'Cancel';
  //   modalRef.componentInstance.confirmButtonLabel = 'Create';
  //   modalRef.componentInstance.closeIcon = true;
  //   modalRef.result.then(res => {
  //     if (res === 'success') {
  //       this.activeIdTab = 'my';
  //       this.getCommunities();
  //     }
  //   });
  // }
}
