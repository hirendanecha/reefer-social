import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, forkJoin, fromEvent } from 'rxjs';
import { slugify } from 'src/app/@shared/utils/utils';
import { Community } from 'src/app/@shared/constant/customer';
import { CommunityService } from 'src/app/@shared/services/community.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { environment } from 'src/environments/environment';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';
import { Router } from '@angular/router';
import { SeoService } from 'src/app/@shared/services/seo.service';

@Component({
  selector: 'app-add-community-modal',
  templateUrl: './add-community-modal.component.html',
  styleUrls: ['./add-community-modal.component.scss'],
})
export class AddCommunityModalComponent implements OnInit, AfterViewInit {
  @Input() title: string | undefined = 'Apply to be dispensary';
  @Input() cancelButtonLabel: string | undefined = 'Cancel';
  @Input() confirmButtonLabel: string | undefined = 'Create';
  @Input() closeIcon: boolean | undefined;
  @Input() data: any = [];
  @ViewChild('zipCode') zipCode: ElementRef;

  communityDetails = new Community();
  submitted = false;
  registrationMessage = '';
  selectedFile: File;
  userId = '';
  profileId = '';
  originUrl = environment.webUrl + 'dispensaries-wholesale/';
  logoImg: any = {
    file: null,
    url: '',
  };
  coverImg: any = {
    file: null,
    url: '',
  };
  allCountryData: any;
  defaultCountry = 'US';
  allStateData: any;
  selectedState = '';

  practitionerArea: any = [];
  practitionerEmphasis: any = [];
  selectedValues: number[] = [];
  selectedAreaValues: number[] = [];

  communityForm = new FormGroup({
    profileId: new FormControl(),
    name: new FormControl('', [Validators.required]),
    slug: new FormControl('', [Validators.required]),
    image: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    address: new FormControl('', Validators.required),
    country: new FormControl('US', [Validators.required]),
    state: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    zip: new FormControl('', Validators.required),
    phone: new FormControl('', Validators.required),
  });

  constructor(
    public activeModal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    private communityService: CommunityService,
    private toastService: ToastService,
    private customerService: CustomerService,
    private uploadService: UploadFilesService,
    private seoService: SeoService,
    private router: Router
  ) {
    this.userId = window.sessionStorage.user_id;
    this.profileId = localStorage.getItem('profileId');

    const data = {
      title: 'Dispensaries & Wholesale',
      url: `${window.location.href}`,
      description: '',
    };
    this.seoService.updateSeoMetaData(data);
  }

  ngOnInit(): void {
    this.getAllCountries();

    if (this.data.Id) {
      this.communityForm.patchValue({
        profileId: this.data?.profileId,
        image: this.data?.image,
        name: this.data?.name,
        slug: this.data?.slug,
        email: this.data?.email,
        phone: this.data?.phone,
        country: this.data?.country,
        zip: this.data?.zip,
        state: this.data?.state,
        city: this.data?.city,
        address: this.data?.address,
      });
      this.communityForm.get('state').enable();
      this.communityForm.get('city').enable();
      this.communityForm.get('county').enable();
      console.log(this.data);
    }
  }

  ngAfterViewInit(): void {
    fromEvent(this.zipCode.nativeElement, 'input')
      .pipe(debounceTime(1000))
      .subscribe((event) => {
        const val = event['target'].value;
        if (val.length > 3) {
          // this.onZipChange(val);
        }
      });
  }

  uploadImgAndSubmit(): void {
    this.communityForm.get('profileId').setValue(this.profileId);
    let uploadObs = {};
    if (this.logoImg?.file?.name) {
      uploadObs['logoImg'] = this.uploadService.uploadFile(this.logoImg?.file);
    }

    // if (this.coverImg?.file?.name) {
    //   uploadObs['coverImg'] = this.uploadService.uploadFile(
    //     this.coverImg?.file
    //   );
    // }

    if (Object.keys(uploadObs)?.length > 0) {
      this.spinner.show();

      forkJoin(uploadObs).subscribe({
        next: (res: any) => {
          if (res?.logoImg?.body?.url) {
            this.logoImg['file'] = null;
            this.logoImg['url'] = res?.logoImg?.body?.url;
            this.communityForm.get('image').setValue(res?.logoImg?.body?.url);
          }

          // if (res?.coverImg?.body?.url) {
          //   this.coverImg['file'] = null;
          //   this.coverImg['url'] = res?.coverImg?.body?.url;
          //   this.communityForm
          //     .get('coverImg')
          //     .setValue(res?.coverImg?.body?.url);
          // }

          this.spinner.hide();
          this.onSubmit();
        },
        error: (err) => {
          this.spinner.hide();
        },
      });
    } else {
      this.onSubmit();
    }
  }

  onSubmit() {
    if (!this.data.Id) {
      this.spinner.show();
      const formData = this.communityForm.value;
      // formData['emphasis'] = this.selectedValues;
      // formData['areas'] = this.selectedAreaValues;
      if (this.communityForm.valid) {
        this.communityService.createCommunity(formData).subscribe({
          next: (res: any) => {
            this.spinner.hide();
            if (!res.error) {
              this.submitted = true;
              this.createCommunityAdmin(res.data);
              this.toastService.success(
                'Your Dispensaries will be approved within 24 hours!'
              );
              this.activeModal.close('success');
              this.router.navigate(['/dispensaries-wholesale']);
            }
          },
          error: (err) => {
            this.toastService.danger(
              'Please change dispensaries. this dispensaries name already in use.'
            );
            this.spinner.hide();
          },
        });
      } else {
        this.spinner.hide();
        this.toastService.danger('Please enter mandatory fields(*) data.');
      }
    }
    if (this.communityForm.valid && this.data.Id) {
      this.communityService
        .editCommunity(this.communityForm.value, this.data.Id)
        .subscribe({
          next: (res: any) => {
            this.spinner.hide();
            if (!res.error) {
              this.submitted = true;
              // this.createCommunityAdmin(res.data);
              this.toastService.success(
                'Your dispensary edit successfully!'
              );
              this.activeModal.close('success');
            }
          },
          error: (err) => {
            this.toastService.danger(
              'Please change dispensary name. this dispensary name already in use.'
            );
            this.spinner.hide();
          },
        });
    }
  }

  createCommunityAdmin(id): void {
    const data = {
      profileId: this.profileId,
      communityId: id,
      isActive: 'Y',
      isAdmin: 'Y',
    };
    this.communityService.joinCommunity(data).subscribe({
      next: (res: any) => {
        if (res) {
          return res;
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  onCommunityNameChange(): void {
    const slug = slugify(this.communityForm.get('name').value);
    this.communityForm.get('slug').setValue(slug);
  }

  onLogoImgChange(event: any): void {
    this.logoImg = event;
  }

  onCoverImgChange(event: any): void {
    this.coverImg = event;
  }

  getAllCountries() {
    this.spinner.show();

    this.customerService.getCountriesData().subscribe({
      next: (result) => {
        this.spinner.hide();
        this.allCountryData = result;
        this.communityForm.get('zip').enable();
        this.getAllState(this.defaultCountry)
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  onCountryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.getAllState(target.value);
  }
  
  getAllState(selectCountry) {
    // this.spinner.show();
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

  changeCountry() {
    this.communityForm.get('zip').setValue('');
    this.communityForm.get('state').setValue('');
    this.communityForm.get('city').setValue('');
  }

  // onZipChange(event) {
  //   this.spinner.show();
  //   this.customerService
  //     .getZipData(event, this.communityForm.get('Country').value)
  //     .subscribe(
  //       (data) => {
  //         if (data[0]) {
  //           const zipData = data[0];
  //           this.communityForm.get('State').enable();
  //           this.communityForm.get('City').enable();
  //           this.communityForm.get('County').enable();
  //           this.communityForm.patchValue({
  //             State: zipData.state,
  //             City: zipData.city,
  //             County: zipData.places,
  //           });
  //         } else {
  //           this.communityForm.get('State').disable();
  //           this.communityForm.get('City').disable();
  //           this.communityForm.get('County').disable();
  //           this.toastService.danger(data?.message);
  //         }

  //         this.spinner.hide();
  //       },
  //       (err) => {
  //         this.spinner.hide();
  //         console.log(err);
  //       }
  //     );
  // }

  getCategories() {
    this.communityService.getCategories().subscribe({
      next: (res) => {
        this.practitionerArea = res.area;
        this.practitionerEmphasis = res.emphasis;
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  onCheckboxChange(event: any, emphasis: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.selectedValues.push(emphasis.eId);
    } else {
      this.selectedValues = this.selectedValues.filter(
        (id) => id !== emphasis.eId
      );
    }
  }
  onAreaboxChange(event: any, area: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.selectedAreaValues.push(area.aId);
    } else {
      this.selectedAreaValues = this.selectedAreaValues.filter(
        (id) => id !== area.aId
      );
    }
  }

  clearForm(){
    this.router.navigate(['/dispensaries-wholesale'])
  }

  convertToUppercase(event: any) {
    const inputElement = event.target as HTMLInputElement;
    let inputValue = inputElement.value;
    inputValue = inputValue.replace(/\s/g, '');
    inputElement.value = inputValue.toUpperCase();
  }
}
